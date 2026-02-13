# Infrastructure resources - add your cloud resources here
# Examples: VPCs, compute instances, databases, load balancers, etc.

# Placeholder to ensure terraform init works - remove when adding real resources
resource "null_resource" "placeholder" {
  triggers = {
    timestamp = timestamp()
  }
}
