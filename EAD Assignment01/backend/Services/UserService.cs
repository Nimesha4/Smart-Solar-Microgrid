// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: UserService.cs
// Description: MongoDB data access service for User profiles and authentication.
// ============================================================================

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolar.Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _usersCollection;

        // Constructor: Establishes MongoDB client connection and retrieves Users collection
        public UserService(IOptions<SmartSolarDatabaseSettings> smartSolarDatabaseSettings)
        {
            var mongoClient = new MongoClient(smartSolarDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(smartSolarDatabaseSettings.Value.DatabaseName);
            _usersCollection = mongoDatabase.GetCollection<User>(smartSolarDatabaseSettings.Value.UsersCollectionName);
        }

        /// <summary>
        /// Queries and returns all users from MongoDB.
        /// </summary>
        public async Task<List<User>> GetAsync() =>
            await _usersCollection.Find(_ => true).ToListAsync();

        /// <summary>
        /// Finds a specific user by their unique National Identity Card (NIC).
        /// </summary>
        public async Task<User?> GetAsync(string nic) =>
            await _usersCollection.Find(x => x.Nic == nic).FirstOrDefaultAsync();

        /// <summary>
        /// Inserts a new user document into the database.
        /// </summary>
        public async Task CreateAsync(User newUser) =>
            await _usersCollection.InsertOneAsync(newUser);

        /// <summary>
        /// Replaces an existing user document matching the provided NIC.
        /// </summary>
        public async Task UpdateAsync(string nic, User updatedUser) =>
            await _usersCollection.ReplaceOneAsync(x => x.Nic == nic, updatedUser);

        /// <summary>
        /// Deletes a user document by their NIC.
        /// </summary>
        public async Task RemoveAsync(string nic) =>
            await _usersCollection.DeleteOneAsync(x => x.Nic == nic);
            
        /// <summary>
        /// Sets a user's active status flag to false (Deactivated).
        /// </summary>
        public async Task DeactivateAsync(string nic)
        {
            var update = Builders<User>.Update.Set(u => u.IsActive, false);
            await _usersCollection.UpdateOneAsync(u => u.Nic == nic, update);
        }

        /// <summary>
        /// Sets a user's active status flag to true (Activated).
        /// </summary>
        public async Task ActivateAsync(string nic)
        {
            var update = Builders<User>.Update.Set(u => u.IsActive, true);
            await _usersCollection.UpdateOneAsync(u => u.Nic == nic, update);
        }
    }
}
