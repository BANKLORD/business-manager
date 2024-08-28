# PRISMA
## MIGRATION
To run migration in Prisma open console and type:
```console
npx prisma migrate dev --name init
# To adapt database when you pull updates
npx prisma generate
```

# CRUD
## CREATE
1 - Check required request body info (Example of user):
```javascript
const { username, password } = req.body;
if ( !username || !password )
	return res.status(422).json('Missing mandatory fields');
```
2 - Create records (Example of user):
```javascript
const user = await prisma.user.create({
    data: {
      username,
      password,
    },
  })
```
3 - Return success message (Example of user):
```javascript
return res.json(user)
```
## UPDATE
1 - Check required request body info (Example of user):
```javascript
const { username, password } = req.body;
if ( !username || !password )
	return res.status(422).json('Missing mandatory fields');
```
2 - Update or Create records (Example of user):
```javascript
const user = await prisma.user.upsert({
    where: {
      id: parseInt(req.params.id)
    }
    data: {
      username,
      password,
    },
  })
```
3 - Return success message (Example of user):
```javascript
return res.json(user)
```

# Multi-Lang System
## Back-end: 
There is a folder called lang which holds language codes in like 'es.json' or 'en.json' .., program will call those JSON files dynamically through request headers
- Request Headers are going to be set by each client and will be saved in the database Company Model get the lang code and save it in the axios.js file in src.