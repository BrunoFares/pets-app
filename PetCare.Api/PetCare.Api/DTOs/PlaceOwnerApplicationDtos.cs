using System.ComponentModel.DataAnnotations;
using PetCare.Api.Model;

namespace PetCare.Api.DTOs;

public record CreatePlaceOwnerApplicationRequest(
    [Required, MaxLength(200)] string BusinessName,
    [Required, MaxLength(50)] string Phone,
    [Required, EmailAddress, MaxLength(320)] string Email,
    [MaxLength(2000)] string? Description,
    [Required, MaxLength(200)] string AddressLine1,
    [MaxLength(200)] string? AddressLine2,
    [Required, MaxLength(100)] string City,
    [Required, MaxLength(100)] string Country,
    [Required] PlaceType RequestedPlaceType
);

public record PlaceOwnerApplicationResponse(
    long Id,
    long UserId,
    string BusinessName,
    string Phone,
    string Email,
    string? Description,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Country,
    PlaceType RequestedPlaceType,
    PlaceOwnerApplicationStatus Status,
    string? RejectionReason,
    string? AdminNotes,
    long? ReviewedByAdminId,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record AdminPlaceOwnerApplicationListItemResponse(
    long Id,
    long UserId,
    string Username,
    string DisplayName,
    string BusinessName,
    string Phone,
    string Email,
    string City,
    string Country,
    PlaceType RequestedPlaceType,
    PlaceOwnerApplicationStatus Status,
    string? RejectionReason,
    string? AdminNotes,
    long? ReviewedByAdminId,
    string? ReviewedByAdminUsername,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record AdminPlaceOwnerApplicationDetailsResponse(
    long Id,
    long UserId,
    string Username,
    string DisplayName,
    string BusinessName,
    string Phone,
    string Email,
    string? Description,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string Country,
    PlaceType RequestedPlaceType,
    PlaceOwnerApplicationStatus Status,
    string? RejectionReason,
    string? AdminNotes,
    long? ReviewedByAdminId,
    string? ReviewedByAdminUsername,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record AdminPlaceOwnerApplicationListResponse(
    IReadOnlyList<AdminPlaceOwnerApplicationListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record ApprovePlaceOwnerApplicationRequest([MaxLength(1000)] string? AdminNotes);

public record RejectPlaceOwnerApplicationRequest(
    [Required, MaxLength(1000)] string RejectionReason,
    [MaxLength(1000)] string? AdminNotes
);
