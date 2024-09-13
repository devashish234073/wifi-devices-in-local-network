provider "local" {
  
}

resource "null_resource" "download_adb" {
  provisioner "local-exec" {
    command = <<EOT
      Invoke-WebRequest -Uri "https://dl.google.com/android/repository/platform-tools-latest-windows.zip" -OutFile "$env:TEMP\\platform-tools-latest-windows.zip"
      if (!(Test-Path "D:/platform-tools")) { New-Item -ItemType Directory -Path "D:/platform-tools" }
      Expand-Archive -Path "$env:TEMP\\platform-tools-latest-windows.zip" -DestinationPath "D:/platform-tools" -Force
      $oldPath = [System.Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
      if ($oldPath -notlike "*D:/platform-tools/platform-tools*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$oldPath;D:/platform-tools/platform-tools", [System.EnvironmentVariableTarget]::User)
      }
    EOT
    interpreter = ["PowerShell", "-Command"]
  }
}