const express = require('express');
const ethers = require('ethers');
const {MongoClient} = require('mongodb')

const privateKey = "12447b0f78b5cc421b0dcf2cda6078782a752db31bf40fd23f1b2d4fcc0c2094";
// Address: 0x17Ea45ec876d4C38c6b1fFCCD900850750E1116f

const app = express();
const PORT = 8000;

async function checkKey(key, collection) {
    const userObject = await collection.findOne({key: key});
    console.log(userObject);
    if(userObject) {
        return true;
    } else {
        return false;
    }
}

async function returnCollection() {
    const uri = 'mongodb+srv://arihant:scout@oraclepersonas.pucez7y.mongodb.net/?retryWrites=true&w=majority&appName=oraclepersonas';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('oraclepersonas');
        const collection = db.collection('users');
        console.log(collection);

        return collection;
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        throw err; // Rethrow the error for handling elsewhere
    }
}

returnCollection()
    .then(collection => {
        app.get('/api/get_price', async (req,res) => {
            const key = req.query.key;
            const ids = req.query.ticker;
            const checkKeyBool = await checkKey(key, collection);
                if(checkKeyBool===true) {
                    const url = `https://api.coingecko.com/api/v3/simple/price?basic-oracle=CG-uEeT1HthgajkeqsFSdtDBSVA&ids=${ids}&vs_currencies=usd`;
                    const options = {method: 'GET', headers: {accept: 'application/json'}};

                    try{
                        const response = await fetch(url, options);
                        const coinGeckoRes = await response.json();
        
                        console.log(JSON.stringify(coinGeckoRes));
                        const priceData = coinGeckoRes.ethereum.usd;
                        const timestampData = Date.now();
        
                        const walletInstance = new ethers.Wallet(privateKey);
                        const priceInteger = Math.floor(priceData * 100); // Convert price to integer format
                        const message = String(priceInteger) + String(timestampData);
                        console.log(message);
                        // Sign the message
                        const signature = await walletInstance.signMessage(message)
        
                        const signerAddress = ethers.utils.verifyMessage(message, signature);
                        console.log("This is the address of the calculated signer " + signerAddress);

                        if(signerAddress===walletInstance.address){
                            return res.json({price: priceData, timestamp: timestampData, signer: signerAddress, signature: signature});
                        } else {
                            return res.status(400).json({error: 'Error while signing'});
                        }
                    } catch(error){
                        console.error('error:', error);
                        res.status(500).json({error: 'Internal Server Error'});            
                    }
                } else {
                    return res.status(500).json({error: 'Internal Server Error'});
                }
        });
        
        app.post('/api/sign_up', async (req, res) => { // Make the route async
            try {
                const firstname = String(req.headers.firstname);
                const lastname = String(req.headers.lastname);
                const email = String(req.headers.email);
                const password = String(req.headers.password);
                const key = crypto.randomUUID();
        
                const persona_json = {
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    password: password,
                    key: key,
                };
        
                const result = await collection.insertOne(persona_json); // Await here
                console.log('New user inserted', result.insertedId);
        
                return res.json({...result, firstname: firstname, key: key});
            } catch (error) {
                console.error('Error occurred during sign up:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        
        app.post('/api/sign_in', async (req, res) => {
            try{
                const email = req.headers.email;
                const password = req.headers.password;
    
                const userObject = await collection.findOne({email: email});
                const userPassword = userObject.password;
    
                if(userPassword == password) {
                    return res.json({email: userObject.email, key: userObject.key});
                } else {
                    return res.status(400).json({error: 'Incorrect Password'})
                }
            } catch (error) {
                console.log('Error occurred during sign up:', error);
                return res.status(500).json({error: 'Internal Server Error'});
            }
        });
    }).catch(error => {
        console.error('Error occurred during execution:', error);
        // return res.status(500).json({ error: 'Internal Server Error' });
    });

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));