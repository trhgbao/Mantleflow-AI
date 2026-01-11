using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BE.Dtos
{
    public class KycDtos
    {
        public IFormFile FrontImage { get; set; }
        public IFormFile BackImage { get; set; }
        public IFormFile SelfieImage { get; set; }
    }
}