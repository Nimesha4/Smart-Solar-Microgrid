
// ============================================================================
// Course: SE4040 - Enterprise Application Development
// Assignment: Assignment 1 - Smart Solar Microgrid Trading System
// File: TransactionService.cs
// Description: Data access service for recording and retrieving completed energy transactions.
// ============================================================================

using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolar.Backend.Models;

namespace SmartSolar.Backend.Services
{
    public class TransactionService
    {
        private readonly IMongoCollection<Transaction> _transactions;

        /// <summary>
        /// Initializes the MongoDB client and retrieves the transactions collection.
        /// </summary>
        public TransactionService(
            IOptions<SmartSolarDatabaseSettings> settings)
        {
            var config = settings.Value;
            var client = new MongoClient(config.ConnectionString);
            var database = client.GetDatabase(config.DatabaseName);

            _transactions = database.GetCollection<Transaction>(
                config.TransactionsCollectionName);
        }

        /// <summary>
        /// Inserts a finalized transaction record into the MongoDB database.
        /// </summary>
        public async Task CreateAsync(Transaction transaction) =>
            await _transactions.InsertOneAsync(transaction);

        /// <summary>
        /// Finds a transaction associated with a specific reservation ID.
        /// </summary>
        public async Task<Transaction?> GetByReservationIdAsync(
            string reservationId) =>
            await _transactions
                .Find(t => t.ReservationId == reservationId)
                .FirstOrDefaultAsync();

        /// <summary>
        /// Retrieves a transaction by its primary MongoDB ObjectID.
        /// </summary>
        public async Task<Transaction?> GetByIdAsync(string id) =>
            await _transactions
                .Find(t => t.Id == id)
                .FirstOrDefaultAsync();

        /// <summary>
        /// Retrieves all completed energy transactions for audit and reporting.
        /// </summary>
        public async Task<List<Transaction>> GetAsync() =>
            await _transactions
                .Find(_ => true)
                .ToListAsync();

        /// <summary>
        /// Deletes a transaction record from the database by its ID.
        /// </summary>
        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _transactions.DeleteOneAsync(
                t => t.Id == id);

            return result.DeletedCount > 0;
        }
    }
}
