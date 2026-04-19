using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreatePlaceRequest(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(50)] string Phone,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [MaxLength(1024)] string? Photo,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(200)] string AddressLine1,
    [MaxLength(200)] string? AddressLine2,
    [Required, MaxLength(100)] string City,
    [Required, MaxLength(100)] string Country,
    [Required] PlaceStatus Status,
    [Required] PlaceType Type,
    decimal? Latitude,
    decimal? Longitude
);

public record UpdatePlaceRequest(
    [Required, MaxLength(200)] string Name,
    [Required, MaxLength(50)] string Phone,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [MaxLength(1024)] string? Photo,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(200)] string AddressLine1,
    [MaxLength(200)] string? AddressLine2,
    [Required, MaxLength(100)] string City,
    [Required, MaxLength(100)] string Country,
    [Required] PlaceStatus Status,
    [Required] PlaceType Type,
    decimal? Latitude,
    decimal? Longitude
);

public record PlaceResponse(
    Guid Id,
    string Name,
    string Phone,
    string Email,
    string? Photo,
    string? Description,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Country,
    PlaceStatus Status,
    PlaceType Type,
    decimal? Latitude,
    decimal? Longitude,
    DateTimeOffset CreatedAt
);
