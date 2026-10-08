<?php
/**
 * Input Validation Helper
 */

class Validator {
    /**
     * Validate required fields
     * @param array $data
     * @param array $requiredFields
     * @return array|null Returns error array or null if valid
     */
    public static function required($data, $requiredFields) {
        $errors = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                $errors[$field] = "Field {$field} is required";
            } elseif (is_string($data[$field]) && trim($data[$field]) === '') {
                $errors[$field] = "Field {$field} is required";
            } elseif (is_array($data[$field]) && empty($data[$field])) {
                $errors[$field] = "Field {$field} is required";
            }
        }
        
        return empty($errors) ? null : $errors;
    }

    /**
     * Validate numeric value
     * @param mixed $value
     * @return bool
     */
    public static function isNumeric($value) {
        return is_numeric($value);
    }

    /**
     * Validate positive number
     * @param mixed $value
     * @return bool
     */
    public static function isPositive($value) {
        return is_numeric($value) && $value >= 0;
    }

    /**
     * Validate non-negative integer (tolak desimal seperti 1.9;
     * terima 2 dan "2" maupun 2.0 dari JSON)
     * @param mixed $value
     * @return bool
     */
    public static function isNonNegativeInt($value) {
        return is_numeric($value) && $value >= 0 && floor((float)$value) == (float)$value;
    }

    /**
     * Validate date format (YYYY-MM-DD)
     * @param string $date
     * @return bool
     */
    public static function isValidDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Sanitize string input
     * @param string $input
     * @return string
     */
    public static function sanitizeString($input) {
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Validate email
     * @param string $email
     * @return bool
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}
