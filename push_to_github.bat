@echo off
title Push Personal Website to GitHub (GRAPHICMx911)
echo ======================================================================
echo          Pushing Personal Website to GitHub Repository
echo ======================================================================
echo.
echo Target Repository: https://github.com/GRAPHICMx911/PersonalWebsite.git
echo Current Branch:    main
echo.
echo [1/3] Staging all files and commits...
git branch -M main
git add -A
git commit -m "feat(production): complete personal website and CMS deployment package" 2>nul

echo.
echo [2/3] Checking remote connection...
git remote set-url origin https://github.com/GRAPHICMx911/PersonalWebsite.git

echo.
echo [3/3] Pushing to GitHub...
echo (If prompted, please sign in to GitHub in the browser popup window)
echo.
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ======================================================================
    echo  SUCCESS! Your code has been pushed to GitHub:
    echo  https://github.com/GRAPHICMx911/PersonalWebsite
    echo ======================================================================
) else (
    echo.
    echo ======================================================================
    echo  PUSH NOTICE:
    echo  If the repository doesn't exist yet on GitHub:
    echo  1. Go to: https://github.com/new
    echo  2. Type Repository Name: PersonalWebsite
    echo  3. Click "Create repository"
    echo  4. Run this script again!
    echo ======================================================================
)

echo.
pause
