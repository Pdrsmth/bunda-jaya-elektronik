<?php
/**
 * Database Configuration
 * Bunda Jaya Elektronik - API Backend
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'toko_elektronik';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    public $conn;

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            return null;
        }

        return $this->conn;
    }

    /**
     * Begin database transaction
     */
    public function beginTransaction() {
        if ($this->conn) {
            $this->conn->beginTransaction();
        }
    }

    /**
     * Commit database transaction
     */
    public function commit() {
        if ($this->conn) {
            $this->conn->commit();
        }
    }

    /**
     * Rollback database transaction
     */
    public function rollback() {
        if ($this->conn) {
            $this->conn->rollBack();
        }
    }
}
