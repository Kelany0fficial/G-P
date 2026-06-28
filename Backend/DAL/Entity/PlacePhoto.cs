using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL.Entity
{
    public class PlacePhoto
    {
        public Guid Id { get; private set; }

        [Required]
        public Guid PlaceId { get; private set; }
        [ForeignKey("PlaceId")]
        public virtual Place Place { get; private set; }



        [Required]
        public string UserId { get; private set; }
        [ForeignKey("UserId")]
        public virtual AppUser User { get; private set; }



        [Required]
        public string PhotoUrl { get; private set; }



        public DateTime UploadedAt { get; private set; }



        protected PlacePhoto() { }



        public PlacePhoto(Guid placeId, string userId, string photoUrl)
        {
            Id = Guid.NewGuid();
            PlaceId = placeId;
            UserId = userId;
            PhotoUrl = photoUrl;
            UploadedAt = DateTime.UtcNow;
        }
    }
}
