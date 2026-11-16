const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

const pool = new Pool({
  user: process.env.PGUSER || 'admin',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'RecordDB',
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT || 5432),
});

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  try {
    const result = await pool.query(
      `SELECT record_id, name, employee_id, role, created_at
       FROM records
       WHERE $1 = '' OR name ILIKE $2 OR employee_id ILIKE $2
       ORDER BY created_at DESC, record_id DESC`,
      [search, `%${search}%`]
    );
    res.render('index', { records: result.rows, search });
  } catch (error) {
    console.error('Error retrieving records:', error);
    res.status(500).send('Unable to retrieve records. Check the PostgreSQL connection and try again.');
  }
});

app.get('/create-record', (req, res) => {
  res.render('create-record', {
    error: null,
    values: { name: '', employee_id: '', role: '' },
  });
});

app.post('/create-record', async (req, res) => {
  const values = {
    name: typeof req.body.name === 'string' ? req.body.name.trim() : '',
    employee_id: typeof req.body.employee_id === 'string' ? req.body.employee_id.trim() : '',
    role: typeof req.body.role === 'string' ? req.body.role.trim() : '',
  };

  let validationError = null;
  if (!values.name || !values.employee_id) {
    validationError = 'Name and Employee ID are required.';
  } else if (values.name.length > 200 || values.employee_id.length > 100 || values.role.length > 200) {
    validationError = 'Name, Employee ID, or Role exceeds the allowed length.';
  }

  if (validationError) {
    return res.status(400).render('create-record', {
      error: validationError,
      values,
    });
  }

  try {
    await pool.query(
      'INSERT INTO records (name, employee_id, role) VALUES ($1, $2, $3)',
      [values.name, values.employee_id, values.role]
    );
    res.redirect('/');
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).render('create-record', {
      error: 'Unable to save the record. Check the PostgreSQL connection and try again.',
      values,
    });
  }
});

app.get('/edit-record/:id', async (req, res) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) {
    return res.status(404).send('Record not found.');
  }

  try {
    const result = await pool.query(
      'SELECT record_id, name, employee_id, role FROM records WHERE record_id = $1',
      [recordId]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Record not found.');
    }
    res.render('edit-record', { error: null, record: result.rows[0] });
  } catch (error) {
    console.error('Error retrieving record for editing:', error);
    res.status(500).send('Unable to retrieve this record.');
  }
});

app.post('/edit-record/:id', async (req, res) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) {
    return res.status(404).send('Record not found.');
  }

  const record = {
    record_id: recordId,
    name: typeof req.body.name === 'string' ? req.body.name.trim() : '',
    employee_id: typeof req.body.employee_id === 'string' ? req.body.employee_id.trim() : '',
    role: typeof req.body.role === 'string' ? req.body.role.trim() : '',
  };
  let validationError = null;
  if (!record.name || !record.employee_id) {
    validationError = 'Name and Employee ID are required.';
  } else if (record.name.length > 200 || record.employee_id.length > 100 || record.role.length > 200) {
    validationError = 'Name, Employee ID, or Role exceeds the allowed length.';
  }

  if (validationError) {
    return res.status(400).render('edit-record', { error: validationError, record });
  }

  try {
    const result = await pool.query(
      'UPDATE records SET name = $1, employee_id = $2, role = $3 WHERE record_id = $4',
      [record.name, record.employee_id, record.role, recordId]
    );
    if (result.rowCount === 0) {
      return res.status(404).send('Record not found.');
    }
    res.redirect('/');
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).render('edit-record', {
      error: 'Unable to update the record. Check the PostgreSQL connection and try again.',
      record,
    });
  }
});

app.post('/delete-record/:id', async (req, res) => {
  const recordId = Number(req.params.id);
  if (!Number.isSafeInteger(recordId) || recordId < 1) {
    return res.status(404).send('Record not found.');
  }

  try {
    const result = await pool.query('DELETE FROM records WHERE record_id = $1', [recordId]);
    if (result.rowCount === 0) {
      return res.status(404).send('Record not found.');
    }
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).send('Unable to delete the record. Check the PostgreSQL connection and try again.');
  }
});

async function startServer() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        record_id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        role VARCHAR(200) NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    app.listen(port, () => {
      console.log(`Employee Records app running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to initialize the records table. Check your PostgreSQL settings:', error);
    await pool.end();
    process.exitCode = 1;
  }
}

startServer();
