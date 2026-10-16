
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

        public async Task CreateAsync(Transaction transaction) =>
            await _transactions.InsertOneAsync(transaction);

        public async Task<Transaction?> GetByReservationIdAsync(
            string reservationId) =>
            await _transactions
                .Find(t => t.ReservationId == reservationId)
                .FirstOrDefaultAsync();

        public async Task<List<Transaction>> GetAsync() =>
            await _transactions.Find(_ => true).ToListAsync();
    }
}
