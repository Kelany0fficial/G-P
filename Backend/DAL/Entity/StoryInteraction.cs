namespace DAL.Entity
{

        public class StoryInteraction
        {
            public Guid Id { get; private set; }

            [ForeignKey("Story")]
            public Guid StoryId { get; private set; }
            public virtual Story Story { get; private set; }



            [Required]
            public string UserId { get; private set; }



            public bool IsViewed { get; private set; } = false;
            public bool IsLoved { get; private set; } = false;



            protected StoryInteraction() { }



            public StoryInteraction(Guid storyId, string userId)
            {
                Id = Guid.NewGuid();
                StoryId = storyId;
                UserId = userId;
            }



            public void MarkAsViewed() => IsViewed = true;
            public void ToggleLove() => IsLoved = !IsLoved;
        }


}



