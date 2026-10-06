const express = require('express');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const connectionString =
  process.env.AZURE_SQL_CONNECTION_STRING;

let pool;

// ==============================
// Connect Azure SQL Database
// ==============================
async function connectDB() {
  try {
    pool = await sql.connect(connectionString);

    console.log('Connected to Azure SQL Database');
  } catch (error) {
    console.error(
      'Database connection failed:',
      error
    );

    process.exit(1);
  }
}

// ==============================
// Home
// ==============================
app.get('/', (req, res) => {
  res.json({
    message: 'Badminton Court Booking API is running'
  });
});
// ==============================
// GET all courts
// ==============================
app.get('/courts', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT
        id,
        court_name,
        court_type,
        price_per_hour,
        description
      FROM courts
      ORDER BY id
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error(
      'Get courts error:',
      error
    );

    res.status(500).json({
      error: 'Failed to get courts'
    });
  }
});

// ==============================
// GET all bookings
// ==============================
app.get('/bookings', async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT
        id,
        customer_name,
        court_number,

        CONVERT(
          VARCHAR(10),
          booking_date,
          23
        ) AS booking_date,

        CONVERT(
          VARCHAR(5),
          start_time,
          108
        ) AS start_time,

        CONVERT(
          VARCHAR(5),
          end_time,
          108
        ) AS end_time

      FROM bookings

      ORDER BY
        booking_date,
        start_time
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error(
      'Get bookings error:',
      error
    );

    res.status(500).json({
      error: 'Failed to get bookings'
    });
  }
});

// ==============================
// POST create booking
// ==============================
app.post('/bookings', async (req, res) => {
  try {
    const {
      customer_name,
      court_number,
      booking_date,
      start_time,
      end_time
    } = req.body;

    // --------------------------
    // Validate required fields
    // --------------------------
    if (
      !customer_name ||
      !court_number ||
      !booking_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // --------------------------
    // Validate time
    // --------------------------
    if (start_time >= end_time) {
      return res.status(400).json({
        error:
          'End time must be later than start time'
      });
    }

    // --------------------------
    // Check overlapping booking
    // --------------------------
    const overlapResult = await pool
      .request()

      .input(
        'court_number',
        sql.NVarChar(20),
        court_number
      )

      .input(
        'booking_date',
        sql.Date,
        booking_date
      )

      .input(
        'start_time',
        sql.VarChar(8),
        start_time
      )

      .input(
        'end_time',
        sql.VarChar(8),
        end_time
      )

      .query(`
        SELECT id
        FROM bookings

        WHERE court_number = @court_number

        AND booking_date = @booking_date

        AND CAST(@start_time AS TIME) < end_time

        AND CAST(@end_time AS TIME) > start_time
      `);

    // --------------------------
    // Court already booked
    // --------------------------
    if (overlapResult.recordset.length > 0) {
      return res.status(409).json({
        error:
          'This court is already booked during the selected time'
      });
    }

    // --------------------------
    // Insert booking
    // --------------------------
    const result = await pool
      .request()

      .input(
        'customer_name',
        sql.NVarChar(100),
        customer_name
      )

      .input(
        'court_number',
        sql.NVarChar(20),
        court_number
      )

      .input(
        'booking_date',
        sql.Date,
        booking_date
      )

      .input(
        'start_time',
        sql.VarChar(8),
        start_time
      )

      .input(
        'end_time',
        sql.VarChar(8),
        end_time
      )

      .query(`
        INSERT INTO bookings (
          customer_name,
          court_number,
          booking_date,
          start_time,
          end_time
        )

        OUTPUT
          INSERTED.id,
          INSERTED.customer_name,
          INSERTED.court_number

        VALUES (
          @customer_name,
          @court_number,
          @booking_date,
          CAST(@start_time AS TIME),
          CAST(@end_time AS TIME)
        )
      `);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.recordset[0]
    });

  } catch (error) {
    console.error(
      'Create booking error:',
      error
    );

    res.status(500).json({
      error: 'Failed to create booking'
    });
  }
});

// ==============================
// DELETE booking
// ==============================
app.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({
        error: 'Invalid booking ID'
      });
    }

    const result = await pool
      .request()

      .input(
        'id',
        sql.Int,
        Number(id)
      )

      .query(`
        DELETE FROM bookings

        OUTPUT
          DELETED.id,
          DELETED.customer_name,
          DELETED.court_number

        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    res.json({
      message: 'Booking deleted successfully',
      booking: result.recordset[0]
    });

  } catch (error) {
    console.error(
      'Delete booking error:',
      error
    );

    res.status(500).json({
      error: 'Failed to delete booking'
    });
  }
});

// ==============================
// Start Server
// ==============================
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
}

startServer();

