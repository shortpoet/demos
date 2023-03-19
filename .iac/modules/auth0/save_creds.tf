resource "null_resource" "save_creds" {
  triggers = {
    client_id     = auth0_client.this.client_id
    client_secret = auth0_client.this.client_secret
  }
  provisioner "local-exec" {
    command = "pass insert -m Cloud/auth0/${local.application_name}/client_id <<< ${auth0_client.this.client_id}"
  }
  provisioner "local-exec" {
    command = "pass insert -m Cloud/auth0/${local.application_name}/client_secret <<< ${auth0_client.this.client_secret}"
  }
}
