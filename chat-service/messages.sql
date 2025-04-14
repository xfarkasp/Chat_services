CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id),
  receiver_id INT REFERENCES users(id),
  content TEXT NOT NULL,
  media_url TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
