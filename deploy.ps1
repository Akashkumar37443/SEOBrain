# SEOBrain Quick Deploy Script
# Run this to prepare your project for deployment

Write-Host "🚀 SEOBrain Deployment Preparation" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 20+ first." -ForegroundColor Red
    exit 1
}

# Check .NET
if (!(Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host "❌ .NET SDK is not installed. Please install .NET 8.0+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites found" -ForegroundColor Green
Write-Host ""

# Update API URL in netlify.toml
$renderUrl = Read-Host "Enter your Render backend URL (or press Enter to skip for now)"
if ($renderUrl) {
    $netlifyToml = Get-Content "netlify.toml" -Raw
    $netlifyToml = $netlifyToml -replace "https://your-render-backend-url.onrender.com", $renderUrl
    Set-Content "netlify.toml" $netlifyToml
    Write-Host "✅ Updated netlify.toml with Render URL" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
cd client
npm install
npm run build
cd ..

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔨 Building backend..." -ForegroundColor Yellow
cd server-core/SEOBrain.API
dotnet restore
dotnet build -c Release
cd ../..

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Code is ready for deployment"
Write-Host "2. ⬜ Push to GitHub: git push origin main"
Write-Host "3. ⬜ Create Render account: https://render.com"
Write-Host "4. ⬜ Deploy backend via render.yaml Blueprint"
Write-Host "5. ⬜ Create Netlify account: https://netlify.com"
Write-Host "6. ⬜ Deploy frontend from client/dist folder"
Write-Host "7. ⬜ Update VITE_API_URL with your Render URL"
Write-Host "8. ⬜ Add Email environment variables to Render"
Write-Host ""
Write-Host "📖 Full guide: DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎉 Your app is ready to deploy!" -ForegroundColor Green
