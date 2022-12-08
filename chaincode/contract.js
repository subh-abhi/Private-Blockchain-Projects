'use-strict';

const {Contract} = require("fabric-contract-api");

const transactionIds = {
    'upg100' : 100,
    'upg500' : 500, 
    'upg1000' : 1000
};

const propertyStatus = {
    'requested' : 'REQUESTED',
    'registered' : 'REGISTERED',
    'onSale' : 'ON_SALE'

};


class UserContract extends Contract{

    constructor(){
        super('org.property-registration-network.user');

    }



//A. Intantiate Function is used to trigger or invoke function while deploying or committing

async instantiate(ctx){

    console.log("User Contract was successfully deployed.");

}

// 1. Request for creating a new user
// requestNewUser

async requestNewUser(ctx, name, email, phone, ssn ){

    if('usersMSP'!=ctx.clientIdentity.mspId){
        throw new Error('You are not authorized to perform this operation');
    }
    
    //Creating composite key for user request.
    const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
    
    //Getting the data buffer for pre-check if user is pre-existing or not
    const dataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));

    
    if(dataBuffer.toString()){
        throw new Error('User with same name ' +name+ ' and ssn ' +ssn + ' already exist on the network.');

    } else {
    //Creating new user Object
    const newUserObject = {
        docType : 'User',
        ssn : ssn,
        name : name,
        email : email,
        phone : phone,
        state : 'REQUESTED',
        createdBy : ctx.clientIdentity.getID(),
        createdAt : ctx.stub.getTxTimestamp(),
        updatedBy : ctx.clientIdentity.getID(),
        updatedAt : ctx.stub.getTxTimestamp()
    };

    //Converting the user JSON object to Buffer
    const userBuffer = Buffer.from(JSON.stringify(newUserObject));
    
    //Using putState to use the userKey and userBuffer for inserting details on the network.
    await ctx.stub.putState(userKey, userBuffer);
    return newUserObject;
    }
};


// 2. User recharges their accounts with upgradCoins
// rechargeAccount

 async rechargeAccount(ctx, name, ssn, bankTxnId){
     
    if('usersMSP'!=ctx.clientIdentity.mspId){
        throw new Error('You are not authorized to perform this operation');
    }

    const userKey = ctx.stub.createCompositeKey('regnet.user',[name, ssn]);
    let dataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));

    if(!dataBuffer.toString()){
        throw new Error("User with name" +name+ ' and ssn ' +ssn+ ' is not avaialbe or approved to use recharge function');
    }

    if(transactionIds[bankTxnId]){
        let userObject = JSON.parse(dataBuffer.toString());
        userObject.upgradCoins += transactionIds[bankTxnId];
        
        //Converting the user JSON object to Buffer
        const userBuffer = Buffer.from(JSON.stringify(userObject));
        
        //Using putState to use the userKey and userBuffer for inserting details on the network.
        await ctx.stub.putState(userKey, userBuffer);
        return userObject;
        }
        else{
            throw new Error('Invalid Bank Transaction ID.');
        }
}

// 3. To View the user details by another user
//viewUser

async viewUser(ctx, name, ssn){

    //Creating the composite key for the user
    const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);

    //Buffer string about the user
    const userBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));
    
    //Condition check if user exist or not.
    if(userBuffer){
        return JSON.parse(userBuffer.toString());
    }
    else{
        return "Asset with key " +name+"and "+ssn+" does not exist on the network.";
    }

}

// 4. To raise a request for the property registration
//propertyRegistrationRequest

async propertyRegistrationRequest(ctx, propertyId, price, status, name, ssn){
    if('usersMSP'!=ctx.clientIdentity.mspId){
        throw new Error('You are not authorized to perform this operation');
    }
       
    //To create a composite key for the user which is to be used later to check the exitsence in the network
    const ownerKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);
    let owner = await ctx.stub.getState(ownerKey).catch(err => console.log(err));

    //To create a composite key for the propety registration with the user details if existing already
    const propertyKey = ctx.stub.createCompositeKey('regnet.property',[propertyId]);
    let property = ctx.stub.getState(propertyKey).catch(err => console.log(err));

    if(owner.length === 0 || property.length !==0){
        throw new Error('Invalid Property details with User name: ' + name + 'ssn: ' + ssn + 'and propertyId: '+ propertyId);
    } else {
            if(!propertyStatus[status]){
                throw new Error('Invalid Property status : ' +status+ '. (USE - requesed, registered, onSale)');

            }
            else{
            
            let newPropertyObject = {
                docType : 'Property',
                propertyId : propertyId,
                owner : ownerKey,
                price : price,
                status : status,
                createdBy : ctx.clientIdentity.getID(),
                createdAt : ctx.stub.getTxTimestamp(),
                updatedBy : ctx.clientIdentity.getID(),
                updatedAt : ctx.stub.getTxTimestamp()
            };

        //Converting the JSON object to a buffer and send it to blockchain for storage
        let dataBuffer = Buffer.from(JSON.stringify(newPropertyObject));
        await ctx.stub.putState(propertyKey,dataBuffer);
        
        //Returning the newPropertyObject
        return newPropertyObject;
        }
    }
};

//5. To view the enlisted properties with their onSale or not on Sale status
//viewProperty

async viewProperty(ctx, propertyId){

    //Creating the composite key for the property
    const propertyKey = ctx.stub.createCompositeKey('regnet.property',[propertyId]);

    //Creating the property Buffer to get the property details
    const propertyBuffer = ctx.stub.getState(propertyKey).catch(err => console.log(err));

    //Condition checking if the property exist or not on the network.
    if(propertyBuffer.toString()){
        return JSON.parse(propertyBuffer.toString());
    }
    else {
        return "Property with id " +propertyId+" does not exist on the network.." ; 
    }
}

//6. To update the enlisted property to onSale status
//updateProperty

async updateProperty (ctx,propertyId,status,name, ssn){

    if('usersMSP'!=ctx.clientIdentity.mspId){
        throw new Error('You are not authorized to perform this operation');
    }

    //Property pre-existence check
    const propertyKey = ctx.stub.createCompositeKey('regnet.property',[propertyId]);
    const propertyDataBuffer = await ctx.stub.getState(propertyKey).catch(err => console.log(err));
    if(!propertyDataBuffer.toString()){
        throw new Error('Property with property id : ' +propertyId+ ' does not exist with the provide name and ssn.');
    }

    //User pre-existence check
    const userKey = ctx.stub.createCompositeKey('regnet.user',[name, ssn]);
    const userDataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));
    if(!userDataBuffer.toString()){
        throw new Error('User with name : ' +name+ ' and ssn : ' +ssn+ ' does not exist on the network.');
    }

    //Property status validation check
    if(!propertyStatus[status]){
        throw new Error('Invalid Property status : ' +status+ '. (USE - requesed, registered, onSale)');
    }

    let propertyObject = JSON.parse(propertyDataBuffer.toString());
    if(userKey == propertyObject.owner){
        propertyObject.status = propertyStatus[status],
        propertyObject.updatedBy = ctx.clientIdentity.getID(),
        propertyObject.updateAt = ctx.stub.getTxTimestamp()
        
        
        let dataBuffer = Buffer.from(JSON.stringify(propertyObject));
        await ctx.stub.putState(propertyKey,dataBuffer);
        
        return propertyObject;
    } else {
        throw new Error('Property can not be updated as the user details are not of the owner.');
        }
}



//7. To purchase the enlisted property
//purchaseProperty

async purchaseProperty(ctx, propertyId, name, ssn){

    if('usersMSP'!=ctx.clientIdentity.mspId){
        throw new Error('You are not authorized to perform this operation');
    }

    //Property pre-existence check
    const propertyKey = ctx.stub.createCompositeKey('regnet.property',[propertyId]);
    const propertyDataBuffer = await ctx.stub.getState(propertyKey).catch(err => console.log(err));
    if(!propertyDataBuffer.toString()){
        throw new Error('Property with property id : ' +propertyId+ ' does not exist with the provide name and ssn.');
    }

    //User pre-existence check
    const userKey = ctx.stub.createCompositeKey('regnet.user',[name, ssn]);
    const userDataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));
    if(!userDataBuffer.toString()){
        throw new Error('User with name : ' +name+ ' and ssn : ' +ssn+ ' does not exist on the network.');
    }

    //Property Object to check if property is for sale or not 
    const propertyObject = JSON.parse(propertyDataBuffer.toString());
    if(propertyObject.status != propertyStatus['onSale']){
        throw new Error('Property is not for sale');
    }

    //To check if the user is not the Buyer 
    if(userKey != propertyObject.owner){
        
        let userObject = JSON.parse(userDataBuffer.toString());

        if(userObject.upgradCoins >= propertyObject.price){

            let ownerDataBuffer = await ctx.stub.getState(propertyObject.owner).catch(err => console.log(err)); 
            let ownerUserObject = JSON.parse(ownerDataBuffer.toString());


            //DEBIT from Buyer account and CREDIT to owner account
            userObject.upgradCoins -= propertyObject.price;
            ownerUserObject += propertyObject.price;

            propertyObject.owner = userKey;
            propertyObject.status = propertyId['registered'];
            propertyObject.updatedBy = ctx.clientIdentity.getID();
            propertyObject.updatedAt = ctx.stub.getTxTimestamp();

            
            const userBuffer = Buffer.from(JSON.stringify(userObject));
            await ctx.stub.putState(userKey, userBuffer);

            const propBuffer = Buffer.from(JSON.stringify(propertyObject));
            await ctx.stub.putState(propertyKey, propBuffer);

            return propertyObject;

            }
            throw new Error ('You do not have enough balance. Recharge your account before purchase.');
        } else{
            throw new Error ('Owner can not be the buyer of the same property.');
        }

    };



}   



module.exports = RegnetContract;