// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: ReservationService.cs
// Description: Data access service for managing energy reservations in MongoDB.
// ============================================================================

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

        /// <summary>
        /// Initializes the MongoDB client and retrieves the reservations collection.
        /// </summary>
        public ReservationService(IOptions<SmartSolarDatabaseSettings> smartSolarDatabaseSettings)
        {
            var mongoClient = new MongoClient(smartSolarDatabaseSettings.Value.ConnectionString);
            var mongoDatabase = mongoClient.GetDatabase(smartSolarDatabaseSettings.Value.DatabaseName);
            _reservationsCollection = mongoDatabase.GetCollection<Reservation>(smartSolarDatabaseSettings.Value.ReservationsCollectionName);
        }

        /// <summary>
        /// Retrieves all energy slot reservations from MongoDB.
        /// </summary>
        public async Task<List<Reservation>> GetAsync() =>
            await _reservationsCollection.Find(_ => true).ToListAsync();

        /// <summary>
        /// Retrieves a specific reservation by its unique MongoDB identifier.
        /// </summary>
        public async Task<Reservation?> GetAsync(string id) =>
            await _reservationsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
            
        /// <summary>
        /// Retrieves all reservations associated with a specific prosumer NIC.
        /// </summary>
        public async Task<List<Reservation>> GetByProsumerAsync(string nic) =>
            await _reservationsCollection.Find(x => x.ProsumerNic == nic).ToListAsync();

        /// <summary>
        /// Inserts a new energy slot reservation into the MongoDB collection.
        /// </summary>
        public async Task CreateAsync(Reservation newRes) =>
            await _reservationsCollection.InsertOneAsync(newRes);

        /// <summary>
        /// Replaces an existing reservation record with updated details.
        /// </summary>
        public async Task UpdateAsync(string id, Reservation updatedRes) =>
            await _reservationsCollection.ReplaceOneAsync(x => x.Id == id, updatedRes);

        /// <summary>
        /// Deletes a reservation from MongoDB by its ID.
        /// </summary>
        public async Task RemoveAsync(string id) =>
            await _reservationsCollection.DeleteOneAsync(x => x.Id == id);
    }
}
