
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartSolar.Backend.Models;

namespace SmartSolar.Backend.Services
{
    public class TransactionService
    {
        private readonly IMongoCollection<Transaction> _transactions;

        public TransactionService(
            IOptions<SmartSolarDatabaseSettings> settings)
        {
            var config = settings.Value;
            var client = new MongoClient(config.ConnectionString);
            var database = client.GetDatabase(config.DatabaseName);

            _transactions = database.GetCollection<Transaction>(
                config.TransactionsCollectionName);
        }

        // Create a new transaction
        public async Task CreateAsync(Transaction transaction) =>
            await _transactions.InsertOneAsync(transaction);

        // Get a transaction by its reservation ID
        public async Task<Transaction?> GetByReservationIdAsync(
            string reservationId) =>
            await _transactions
                .Find(t => t.ReservationId == reservationId)
                .FirstOrDefaultAsync();

        // Get a transaction by its MongoDB ID
        public async Task<Transaction?> GetByIdAsync(string id) =>
            await _transactions
                .Find(t => t.Id == id)
                .FirstOrDefaultAsync();

        // Get all transactions
        public async Task<List<Transaction>> GetAsync() =>
            await _transactions
                .Find(_ => true)
                .ToListAsync();

        // Delete a transaction by its MongoDB ID
        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _transactions.DeleteOneAsync(
                t => t.Id == id);

            return result.DeletedCount > 0;
        }
    }
}
