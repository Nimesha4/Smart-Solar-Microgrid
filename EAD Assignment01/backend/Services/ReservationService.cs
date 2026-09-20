using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolar.Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SmartSolar.Backend.Services
{
    public class ReservationService
    {
        private readonly IMongoCollection<Reservation> _reservationsCollection;

        public ReservationService(IOptions<SmartSolarDatabaseSettings> smartSolarDatabaseSettings)
        {
            var mongoClient = new MongoClient(smartSolarDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(smartSolarDatabaseSettings.Value.DatabaseName);
            _reservationsCollection = mongoDatabase.GetCollection<Reservation>(smartSolarDatabaseSettings.Value.ReservationsCollectionName);
        }

        public async Task<List<Reservation>> GetAsync() =>
            await _reservationsCollection.Find(_ => true).ToListAsync();

        public async Task<Reservation?> GetAsync(string id) =>
            await _reservationsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
            
        public async Task<List<Reservation>> GetByProsumerAsync(string nic) =>
            await _reservationsCollection.Find(x => x.ProsumerNic == nic).ToListAsync();

        public async Task CreateAsync(Reservation newRes) =>
            await _reservationsCollection.InsertOneAsync(newRes);

        public async Task UpdateAsync(string id, Reservation updatedRes) =>
            await _reservationsCollection.ReplaceOneAsync(x => x.Id == id, updatedRes);

        public async Task RemoveAsync(string id) =>
            await _reservationsCollection.DeleteOneAsync(x => x.Id == id);
    }
}
