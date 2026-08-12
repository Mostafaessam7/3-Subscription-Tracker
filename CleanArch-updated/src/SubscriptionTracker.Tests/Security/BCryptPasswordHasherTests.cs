using SubscriptionTracker.Infrastructure.Security;
using Xunit;

namespace SubscriptionTracker.Tests.Security
{
    public class BCryptPasswordHasherTests
    {
        private readonly BCryptPasswordHasher _hasher = new();

        [Fact]
        public void Hash_ProducesDifferentValue_ThanPlainPassword()
        {
            var hash = _hasher.Hash("MyP@ssw0rd");

            Assert.NotEqual("MyP@ssw0rd", hash);
        }

        [Fact]
        public void Hash_ProducesDifferentHash_ForSamePassword_EachTime()
        {
            // BCrypt بيولّد Salt عشوائي في كل مرة، فنفس الباسورد المفروض يطلع بيه Hash مختلف كل مرة
            var hash1 = _hasher.Hash("MyP@ssw0rd");
            var hash2 = _hasher.Hash("MyP@ssw0rd");

            Assert.NotEqual(hash1, hash2);
        }

        [Fact]
        public void Verify_ReturnsTrue_ForCorrectPassword()
        {
            var hash = _hasher.Hash("MyP@ssw0rd");

            Assert.True(_hasher.Verify("MyP@ssw0rd", hash));
        }

        [Fact]
        public void Verify_ReturnsFalse_ForWrongPassword()
        {
            var hash = _hasher.Hash("MyP@ssw0rd");

            Assert.False(_hasher.Verify("WrongPassword", hash));
        }
    }
}
