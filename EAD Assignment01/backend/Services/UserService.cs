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

        public UserService(IOptions<SmartSolarDatabaseSettings> smartSolarDatabaseSettings)
        {
            var mongoClient = new MongoClient(smartSolarDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(smartSolarDatabaseSettings.Value.DatabaseName);
            _usersCollection = mongoDatabase.GetCollection<User>(smartSolarDatabaseSettings.Value.UsersCollectionName);
        }

        public async Task<List<User>> GetAsync() =>
            await _usersCollection.Find(_ => true).ToListAsync();

        public async Task<User?> GetAsync(string nic) =>
            await _usersCollection.Find(x => x.Nic == nic).FirstOrDefaultAsync();

        public async Task CreateAsync(User newUser) =>
            await _usersCollection.InsertOneAsync(newUser);

        public async Task UpdateAsync(string nic, User updatedUser) =>
            await _usersCollection.ReplaceOneAsync(x => x.Nic == nic, updatedUser);

        public async Task RemoveAsync(string nic) =>
            await _usersCollection.DeleteOneAsync(x => x.Nic == nic);
            
        public async Task DeactivateAsync(string nic)
        {
            var update = Builders<User>.Update.Set(u => u.IsActive, false);
            await _usersCollection.UpdateOneAsync(u => u.Nic == nic, update);
        }

        public async Task ActivateAsync(string nic)
        {
            var update = Builders<User>.Update.Set(u => u.IsActive, true);
            await _usersCollection.UpdateOneAsync(u => u.Nic == nic, update);
        }
    }
}
