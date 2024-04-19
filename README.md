## config.yml setup

`volume/config.yml`

```yaml
final_group_id: FINAL_GROUP_ID

from_group_ids:
    - FINAL_GROUP_ID_1  # Telegram Group Title
    - FINAL_GROUP_ID_2  # Telegram Group Title
    - FINAL_GROUP_ID_3  # Telegram Group Title

api:
    - phone: "API_1_PHONE_NUMBER"
      id: API_1_ID
      hash: API_1_HASH

    - phone: "API_2_PHONE_NUMBER"
      id: API_2_ID
      hash: API_2_HASH
```

## Telegram Api

- create a Telegram account using any **phone** number
- go to http://my.telegram.org and log in
- click on API development tools and fill the required fields
- put any app name and select _other_ in platform
- -> _get the api_ **id** _and_ **hash**