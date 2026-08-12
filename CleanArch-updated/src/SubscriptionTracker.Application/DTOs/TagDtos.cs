using System.ComponentModel.DataAnnotations;

namespace SubscriptionTracker.Application.DTOs
{
    public class TagDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
    }

    public class CreateTagDto
    {
        [Required]
        [MaxLength(30)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(7)]
        public string Color { get; set; } = "#818CF8";
    }

    public class UpdateTagDto
    {
        [Required]
        [MaxLength(30)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(7)]
        public string Color { get; set; } = string.Empty;
    }
}
