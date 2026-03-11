const payload = {
    "object": "whatsapp_business_account",
    "entry": [
        {
            "id": "839181512271476",
            "changes": [
                {
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {
                            "display_phone_number": "15551365470",
                            "phone_number_id": "850407801500536"
                        },
                        "contacts": [
                            {
                                "profile": {
                                    "name": "Suraj Sharma"
                                },
                                "wa_id": "917817963135",
                                "country_code": "IN"
                            }
                        ],
                        "messages": [
                            {
                                "from": "917817963135",
                                "id": "wamid.HBgMOTE3ODE3OTYzMTM1FQIAEhgWM0VCMDgwQkQ1NDlEMjY4MzQ5MTkyQwA=",
                                "timestamp": "1772749003",
                                "text": {
                                    "body": "hello from manual test"
                                },
                                "from_logical_id": "251075282108597",
                                "type": "text"
                            }
                        ]
                    },
                    "field": "messages"
                }
            ]
        }
    ]
};

fetch('http://localhost:3000/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
    .then(res => res.text())
    .then(text => console.log('Response:', text))
    .catch(err => console.error('Error:', err));
