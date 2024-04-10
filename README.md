### confirm authentication

To enter the authentication code within the docker container, run the following command:

```bash
docker exec serpioctopus sh -c 'echo PUT-VERIFICATION-CODE-HERE > /home/node/.AUTHCODE'
```