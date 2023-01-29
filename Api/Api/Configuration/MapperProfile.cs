using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Models = Api.Models;
using DataModels = Docamatic.Data.Models;
namespace Api.Configuration
{
    public class MapperProfile : Profile
    {
        public MapperProfile()
        {
            CreateMap<Models.BasicMetric, DataModels.BasicMetric>();
        }
    }
}