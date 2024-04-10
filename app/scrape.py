# scrape.py {api_id} {api_hash} {phone} {from_group} {final_group} {bot_id}

import re
import sys
import time
import random
import traceback

from telethon.sync import TelegramClient
from telethon.errors.rpcerrorlist import PeerFloodError, UserPrivacyRestrictedError
from telethon.tl.functions.channels import InviteToChannelRequest
from telethon.tl.types import InputPeerChannel

client = TelegramClient(sys.argv[3], int(sys.argv[1]), sys.argv[2])

client.connect()
if not client.is_user_authorized():
    print("authorization required!")
    sys.exit(1)

from_group = client.get_entity(int(sys.argv[4]))

time.sleep(1)
final_group = client.get_entity(int(sys.argv[5]))
final_group_entity = InputPeerChannel(final_group.id, final_group.access_hash)

time.sleep(1)
users = client.get_participants(from_group, aggressive=True)

for user in users:
    time.sleep(1)
    try:
        if not user.is_self and not user.bot and user.username and user.photo is None and re.search(r'[^a-zA-Z0-9äöüÄÖÜß]', user.username) is None and user.id != int(sys.argv[6]):
            user_to_add = client.get_input_entity(user.username)
            print("Adding: {}".format(user.username))
            client(InviteToChannelRequest(final_group_entity, [user_to_add]))
            time.sleep(random.randrange(5, 10))
    except PeerFloodError:
        print("[!] Getting Flood Error from telegram. Waiting 10min...")
        time.sleep(600)
    except UserPrivacyRestrictedError:
        print("[!] The user's privacy settings do not allow you to do this. Skipping.")
    except:
        traceback.print_exc()
        print("[!] Unexpected Error")
        continue

    time.sleep(1)
