-- Run this once to set up the database
CREATE DATABASE IF NOT EXISTS wecapurred;
USE wecapurred;

CREATE TABLE IF NOT EXISTS projects (
  id           VARCHAR(36)  PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  client_name  VARCHAR(255) NOT NULL,
  description  TEXT,
  photo_count  INT          DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
  id          VARCHAR(36)  PRIMARY KEY,
  project_id  VARCHAR(36)  NOT NULL,
  image_url   VARCHAR(1000) NOT NULL,
  s3_key      VARCHAR(500),
  location    TEXT,
  length      VARCHAR(50),
  breadth     VARCHAR(50),
  height      VARCHAR(50),
  material    VARCHAR(100),
  notes       TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
