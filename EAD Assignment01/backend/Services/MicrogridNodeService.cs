// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: MicrogridNodeService.cs
// Description: MongoDB data access service for Microgrid Nodes (Solar Stations).
// ============================================================================

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolar.Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Services
{
    public class MicrogridNodeService
    {
        private readonly IMongoCollection<MicrogridNode> _nodesCollection;

        // Constructor: Connects to MongoDB and initializes the MicrogridNodes collection
        public MicrogridNodeService(IOptions<SmartSolarDatabaseSettings> smartSolarDatabaseSettings)
        {
            var mongoClient = new MongoClient(smartSolarDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(smartSolarDatabaseSettings.Value.DatabaseName);
            _nodesCollection = mongoDatabase.GetCollection<MicrogridNode>(smartSolarDatabaseSettings.Value.MicrogridNodesCollectionName);
        }

        /// <summary>
        /// Retrieves all microgrid nodes from the database.
        /// </summary>
        public async Task<List<MicrogridNode>> GetAsync() =>
            await _nodesCollection.Find(_ => true).ToListAsync();

        /// <summary>
        /// Retrieves a microgrid node document by its unique identifier.
        /// </summary>
        public async Task<MicrogridNode?> GetAsync(string id) =>
            await _nodesCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        /// <summary>
        /// Inserts a new microgrid hub record into the collection.
        /// </summary>
        public async Task CreateAsync(MicrogridNode newNode) =>
            await _nodesCollection.InsertOneAsync(newNode);

        /// <summary>
        /// Replaces an existing microgrid node document by ID.
        /// </summary>
        public async Task UpdateAsync(string id, MicrogridNode updatedNode) =>
            await _nodesCollection.ReplaceOneAsync(x => x.Id == id, updatedNode);

        /// <summary>
        /// Deletes a microgrid node document by ID.
        /// </summary>
        public async Task RemoveAsync(string id) =>
            await _nodesCollection.DeleteOneAsync(x => x.Id == id);
            
        /// <summary>
        /// Marks a microgrid node as inactive in MongoDB.
        /// </summary>
        public async Task DeactivateAsync(string id)
        {
            var update = Builders<MicrogridNode>.Update.Set(n => n.IsActive, false);
            await _nodesCollection.UpdateOneAsync(n => n.Id == id, update);
        }
    }
}
