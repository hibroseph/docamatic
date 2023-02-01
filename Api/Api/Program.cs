using Microsoft.AspNetCore.Mvc.Versioning;
using Docamatic.Services.Configuration;
using Docamatic.Data.Configuration;
using Microsoft.Extensions.DependencyInjection;

using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddApiVersioning(opt =>
                                    {
                                        opt.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
                                        opt.AssumeDefaultVersionWhenUnspecified = true;
                                        opt.ReportApiVersions = true;
                                        opt.ApiVersionReader = ApiVersionReader.Combine(new UrlSegmentApiVersionReader(),
                                                                                        new HeaderApiVersionReader("x-api-version"),
                                                                                        new MediaTypeApiVersionReader("x-api-version"));
                                    });
var dbConfig = builder.Configuration.GetSection("Database").Get<DatabaseConfiguration>();
System.Console.WriteLine($"Value of db config: {dbConfig}");
await builder.Services.AddDataServiceRegistration(dbConfig);
builder.Services.AddServicesServiceRegistration();
builder.Services.AddAutoMapper(Assembly.GetExecutingAssembly());
var app = builder.Build();
app.Use(async (context, next) =>
{
    await next.Invoke();
});

app.UseCors(builder => builder
 .AllowAnyOrigin()
 .AllowAnyMethod()
 .AllowAnyHeader()
);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger", "Docamatic API");
    });
}


app.UseAuthorization();

app.MapControllers();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Meta}/{action=Version}/{id?}");

app.Run();
