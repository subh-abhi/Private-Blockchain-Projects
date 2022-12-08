'use-strict';

const {Contract} = require("fabric-contract-api");

const propertyStatus = {
    'requested' : 'REQUESTED',
    'registered' : 'REGISTERED',
    'onSale' : 'ON_SALE'

}

class RegistrarContract extends Contract{

    constructor(){
        super('org.property-registration-network.registrar');
    }


//A. Intantiate Function is used to trigger or invoke function while deploying or committing

async instantiate(ctx){

    console.log("Registrar contract was successfully deployed.");

}

// 1. Approve the creation of new user
// approveNewUser

async approveNewUser(ctx, name, ssn){
    
    if (ctx.clientIdentity.mspId != "registrarMSP") {
        return "Registrar's can only approve user.";
    }

    let registrar = ctx.clientIdentity.getID();

    let userKey = ctx.stub.createCompositeKey('regnet.user',[name, ssn]);
    let userDataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));

    if(!userDataBuffer.toString()){
        throw new Error ('Invalid user details. No such user exists.');
    }
    else{
        let userObject = JSON.parse(userDataBuffer.toString());
        userObject.upgradCoins = 0;
        userObject.state = "APPROVED";
        userObject.updatedBy = registrar;
        userObject.updatedAt = ctx.stub.getTxTimestamp();
        
        const userBuffer = Buffer.from(JSON.stringify(userObject));
        await ctx.stub.putState(userKey, userBuffer);

        return(userObject);
    }

}

// 2. To View the user details by registrar
//viewUser

async viewUser(ctx, name, ssn){

    //Creating the composite key for the user
    const userKey = ctx.stub.createCompositeKey('regnet.user', [name, ssn]);

    //Buffer string about the user
    const userBuffer = await ctx.stub.getState(userKey);
    
    //Condition check if user exist or not.
    if(userBuffer.toString()){
        return JSON.parse(userBuffer.toString());
    }
    else{
        return "Asset with key " +name+"and "+ssn+" does not exist on the network.";
    }

}

// 3. To approve the raised request for the property registration
//approvePropertyRegistration

async approvePropertyRegistration(ctx, propertyId){

    if (ctx.clientIdentity.mspId!= "registrarMSP") {
        return "Registrar can only approve user or property request";
    }

    let registrar = ctx.clientIdentity.getID();

    let propertyKey = ctx.stub.createCompositeKey('regnet.property', [propertyId]);
    let propertyDataBuffer = await ctx.stub.getState(propertyKey).catch(err => console.log(err));

    if(!propertyDataBuffer.toString()){
        throw new Error ('Invalid Property Details. No such property exist.')
    }
    else{
        let propertyObject = JSON.parse(propertyDataBuffer.toString());
        propertyObject.status = propertyStatus['registered'];
        propertyObject.updatedBy = registrar;
        propertyObject.updatedAt = ctx.stub.getTxTimestamp();
    
        let propertyBuffer = Buffer.from(JSON.stringify(propertyObject));
        await ctx.stub.putState(propertyKey, propertyBuffer);
        return propertyObject;
    }

}

//4. To view the enlisted properties with their onSale or not on Sale status
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
        return "Property with id " +propertyId+" does not exist on the network." ; 
    }
}

}

module.exports = RegnetContract;




