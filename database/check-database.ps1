# Database Check Script
# Bunda Jaya Elektronik

$mysqlPath = "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe"
$dbName = "toko_elektronik"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE CHECK: $dbName" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check database exists
Write-Host "[1] Checking database exists..." -ForegroundColor Yellow
& $mysqlPath -u root -e "SHOW DATABASES LIKE '$dbName';"

# Check tables
Write-Host "`n[2] Tables in database:" -ForegroundColor Yellow
& $mysqlPath -u root -e "USE $dbName; SHOW TABLES;"

# Check row counts
Write-Host "`n[3] Data summary:" -ForegroundColor Yellow
& $mysqlPath -u root -e @"
USE $dbName;
SELECT 'users' as tabel, COUNT(*) as jumlah FROM users
UNION ALL
SELECT 'kategori', COUNT(*) FROM kategori
UNION ALL
SELECT 'merek', COUNT(*) FROM merek
UNION ALL
SELECT 'supplier', COUNT(*) FROM supplier
UNION ALL
SELECT 'barang', COUNT(*) FROM barang
UNION ALL
SELECT 'transaksi', COUNT(*) FROM transaksi
UNION ALL
SELECT 'pembelian', COUNT(*) FROM pembelian
UNION ALL
SELECT 'hutang_supplier', COUNT(*) FROM hutang_supplier;
"@

# Check users
Write-Host "`n[4] Users list:" -ForegroundColor Yellow
& $mysqlPath -u root -e "USE $dbName; SELECT id, username, nama, role FROM users;"

# Check kategori
Write-Host "`n[5] Kategori list:" -ForegroundColor Yellow
& $mysqlPath -u root -e "USE $dbName; SELECT id, nama FROM kategori;"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "DATABASE CHECK COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Akses phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor Magenta
Write-Host "Database name: $dbName" -ForegroundColor Magenta
Write-Host "Username: root | Password: (kosong)" -ForegroundColor Magenta
