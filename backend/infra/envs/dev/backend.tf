terraform {
  backend "s3" {
    bucket         = "vinciflow-terraform-state" # Aapka state bucket name
    key            = "dev/terraform.tfstate"      # State file ka path
    region         = "ap-south-1"                 # Mumbai region
    encrypt        = true
    use_lockfile   = true
  }
}