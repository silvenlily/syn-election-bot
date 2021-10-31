$redisStatus = service redis
$mongoStatus = service mongodb

function Test-Administrator  
{  
  $user = [Security.Principal.WindowsIdentity]::GetCurrent();
  (New-Object Security.Principal.WindowsPrincipal $user).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)  
}

if(($redisStatus.status -eq "stopped") -or ($mongoStatus.status -eq "stopped") ){
  if(Test-Administrator){
    if($redisStatus.status -eq "stopped"){
      Write-Output "Starting redis"
      Start-Service redis
    }
    if($mongoStatus.status -eq "stopped"){
      Write-Output "Starting mongo"
      Start-Service mongodb
    }
  }else{
    Write-Output "Requesting Elevation to admin to start mongo or redis"
    $command = "`$dir = `'$PSScriptRoot`'; cd `$dir; .\startDevDBs.ps1"
    Start-Process powershell.exe -Argument "-Command $command" -Verb RunAs
  }
} else {
  Write-Output "MongoDB and redis already running"
}
