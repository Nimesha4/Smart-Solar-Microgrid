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

        public MicrogridNodeService(IOptions<SmartSolarDatabaseSettings> smartSolarDatabaseSettings)
        {
            var mongoClient = new MongoClient(smartSolarDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(smartSolarDatabaseSettings.Value.DatabaseName);
            _nodesCollection = mongoDatabase.GetCollection<MicrogridNode>(smartSolarDatabaseSettings.Value.MicrogridNodesCollectionName);
        }

        public async Task<List<MicrogridNode>> GetAsync() =>
            await _nodesCollection.Find(_ => true).ToListAsync();

        public async Task<MicrogridNode?> GetAsync(string id) =>
            await _nodesCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(MicrogridNode newNode) =>
            await _nodesCollection.InsertOneAsync(newNode);

        public async Task UpdateAsync(string id, MicrogridNode updatedNode) =>
            await _nodesCollection.ReplaceOneAsync(x => x.Id == id, updatedNode);

        public async Task RemoveAsync(string id) =>
            await _nodesCollection.DeleteOneAsync(x => x.Id == id);
            
        public async Task DeactivateAsync(string id)
        {
            var update = Builders<MicrogridNode>.Update.Set(n => n.IsActive, false);
            await _nodesCollection.UpdateOneAsync(n => n.Id == id, update);
        }
    }
}
