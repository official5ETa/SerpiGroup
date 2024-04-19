# auth.py {api_id} {api_hash} {phone}

import sys
import os
import time

from telethon.sync import TelegramClient

phone = sys.argv[3]

client = TelegramClient(f"./shared/{phone}", int(sys.argv[1]), sys.argv[2])

client.connect()
if not client.is_user_authorized():
    client.send_code_request(phone)

    auth_file = f"./shared/{phone}.authcode"
    open(auth_file, 'a').close()

    print("AUTH_REQUIRED")

    with open(auth_file, 'r') as file:
        while True:
            auth_code = file.read().strip()
            if auth_code:
                client.sign_in(phone, auth_code)
                break
            time.sleep(.2)

    os.remove(auth_file)

print("AUTH_SUCCESS")
