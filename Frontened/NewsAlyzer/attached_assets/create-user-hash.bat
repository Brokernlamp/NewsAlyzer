@echo off
:: Usage: create-user-hash.bat username password
setlocal enabledelayedexpansion

if "%~1"=="" (
  echo Usage: create-user-hash.bat username password
  exit /b 1
)
if "%~2"=="" (
  echo Usage: create-user-hash.bat username password
  exit /b 1
)

:: Generate bcrypt hash using Node
node -e "(async()=>{const b=require('bcryptjs');const h=await b.hash(process.argv[2],10);console.log(JSON.stringify({username:process.argv[1],password_hash:h},null,2));})();" %1 %2

endlocal
