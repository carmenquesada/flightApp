Write-Host "=== STEP 1: LOGIN ===" -ForegroundColor Cyan

$loginUrl = "http://localhost:8081/api/auth/login"
$loginBody = @{
    email = "ana@flynow.test"
    password = "demo123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Login successful" -ForegroundColor Green
    $loginResponse | ConvertTo-Json | Write-Host
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

if ($loginResponse.token) {
    Write-Host "`n=== STEP 2: GET FLIGHTS ===" -ForegroundColor Cyan
    $flightsUrl = "http://localhost:8081/api/flights?origin=MAD&destination=OPO"
    
    try {
        $flightsResponse = Invoke-RestMethod -Uri $flightsUrl -Method GET
        Write-Host "Flights obtained" -ForegroundColor Green
        $flightsResponse | ConvertTo-Json | Write-Host
        
        if ($flightsResponse -and $flightsResponse.Count -gt 0) {
            $flightId = $flightsResponse[0].id
            Write-Host "`n=== STEP 3: CREATE BOOKING ===" -ForegroundColor Cyan
            
            $bookingUrl = "http://localhost:8081/api/bookings"
            $bookingBody = @{
                userId = 1
                flightId = $flightId
                passengersCount = 2
            } | ConvertTo-Json
            
            $bookingResponse = Invoke-RestMethod -Uri $bookingUrl -Method POST -ContentType "application/json" -Body $bookingBody
            Write-Host "Booking created" -ForegroundColor Green
            $bookingResponse | ConvertTo-Json | Write-Host
            
            if ($bookingResponse.bookingCode) {
                Write-Host "`n=== FINAL RESULT ===" -ForegroundColor Yellow
                Write-Host "Booking Code: $($bookingResponse.bookingCode)" -ForegroundColor Green
                Write-Host "Status: $($bookingResponse.status)" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
