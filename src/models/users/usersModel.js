const {getMongoDBConnection} = require('../../config/mongo');
const Logger = require('../../helpers/logger');
const bcrypt = require('bcrypt');

class User {
    constructor(data) {
        this.collection = getMongoDBConnection().collection('users');
        this.data = data;
    }

    static generateHash(password) {
        return bcrypt.hash(password, 12);
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        return bcrypt.compare(candidatePassword, hashedPassword);
    }

    validate() {
        if (
            !this.data.username ||
            !this.data.firstName ||
            !this.data.lastName ||
            !this.data.email ||
            !this.data.password ||
            !this.data.mobileNumber
        ) {
            throw new Error('Required fields are missing');
        }
    }

    async save() {
        this.validate();

        if (this.data.password) {
            this.data.password = await User.generateHash(this.data.password);
        }
        await this.completeRegistrationData();

        try {
            await this.collection.insertOne(this.data).catch((err) => {
                Logger.error('Got error while creating user: ', err);
            });
            Logger.info('User saved successfully.');
            return this.data;
        } catch (error) {
            Logger.error(`Error saving user: ${error}`);
            throw new Error('Error saving user');
        }
    }

    completeRegistrationData() {
        this.data.verified = false;
        this.data.activeStatus = false;
        this.data.oauthProfiles = [];
        this.data.acceptTerms = false;
        this.data.verificationToken = '';
        this.data.createdAt = new Date();
        this.data.lastUpdatedAt = new Date();
    }

}

module.exports = User;