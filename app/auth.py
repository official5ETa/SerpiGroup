# auth.py {api_id} {api_hash} {phone}

import sys
import os
import time

from telethon.sync import TelegramClient

phone = sys.argv[3]

client = TelegramClient(phone, int(sys.argv[1]), sys.argv[2])

client.connect()
if not client.is_user_authorized():
    print("authorization required! waiting for authcode...")
    client.send_code_request(phone)

    while True:
        if os.path.exists('.AUTHCODE'):
            with open('.AUTHCODE', 'r+') as file:
                auth_code = file.read().strip()
                if auth_code:
                    client.sign_in(phone, auth_code)
                    file.seek(0)
                    file.truncate()
                    break
    time.sleep(.2)