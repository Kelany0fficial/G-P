namespace DAL.Entity
{
    public class Payment
    {
        public Guid Id { get; private set; }

        [Required]
        public string GuideId { get; private set; }
        public virtual TourGuide Guide { get; private set; }

        [Required]
        public decimal AmountPaid { get; private set; }

        public decimal OutBalance { get; private set; }

        [Required, StringLength(50)]
        public string PayMethod { get; private set; }

        public DateTime PaymentDay { get; private set; } = DateTime.UtcNow;

        protected Payment() { }

        public Payment(string guideId, decimal amountPaid, decimal outBalance, string payMethod)
        {
            if (amountPaid <= 0)
                throw new ArgumentException("Payment amount must be greater than zero.");

            Id = Guid.NewGuid();
            GuideId = guideId;
            AmountPaid = amountPaid;
            OutBalance = outBalance;
            PayMethod = payMethod;
        }
    }
}
