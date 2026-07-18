package com.bloodsystem.service;

import com.bloodsystem.model.*;
import com.bloodsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RequestService {

    @Autowired
    private BloodRequestRepository requestRepository;

    @Autowired
    private HospitalRepository hospitalRepository;

    @Autowired
    private BloodGroupRepository bloodGroupRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BloodInventoryRepository inventoryRepository;

    @Autowired
    private BloodIssueLogRepository issueLogRepository;

    public List<BloodRequest> getAllRequests() {
        return requestRepository.findAll().stream()
                .map(this::normalizeRequest)
                .toList();
    }

    public BloodRequest getRequestById(UUID id) {
        BloodRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found with ID: " + id));
        return normalizeRequest(request);
    }

    @Transactional
    public BloodRequest createRequest(BloodRequest request) {
        if (request.getHospital() == null || request.getHospital().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hospital is required");
        }
        Hospital hospital = hospitalRepository.findById(request.getHospital().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hospital not found"));
        request.setHospital(hospital);

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one blood item is required");
        }

        for (BloodRequestItem item : request.getItems()) {
            if (item.getBloodGroup() == null || item.getBloodGroup().getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blood group is required for each item");
            }
            BloodGroup bloodGroup = bloodGroupRepository.findById(item.getBloodGroup().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blood group not found"));
            item.setBloodGroup(bloodGroup);

            if (item.getRequestedUnits() == null || item.getRequestedUnits().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested units must be greater than zero");
            }
            if (item.getIssuedUnits() == null) {
                item.setIssuedUnits(BigDecimal.ZERO);
            }
            item.setBloodRequest(request);
        }

        if (request.getStatus() == null || request.getStatus().isBlank()) {
            request.setStatus("Pending");
        }
        if (request.getRequestDate() == null) {
            request.setRequestDate(LocalDate.now());
        }
        if (request.getPriority() == null || request.getPriority().isBlank()) {
            request.setPriority("Medium");
        }

        return requestRepository.save(request);
    }

    @Transactional
    public BloodRequest updateRequest(UUID id, BloodRequest details) {
        BloodRequest request = getRequestById(id);
        if (!isPending(request)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending requests can be edited");
        }

        if (details.getHospital() == null || details.getHospital().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hospital is required");
        }
        Hospital hospital = hospitalRepository.findById(details.getHospital().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hospital not found"));
        request.setHospital(hospital);

        if (details.getItems() == null || details.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one blood item is required");
        }

        request.getItems().clear();
        for (BloodRequestItem itemDetails : details.getItems()) {
            if (itemDetails.getBloodGroup() == null || itemDetails.getBloodGroup().getId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blood group is required for each item");
            }
            BloodGroup bloodGroup = bloodGroupRepository.findById(itemDetails.getBloodGroup().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Blood group not found"));
            if (itemDetails.getRequestedUnits() == null || itemDetails.getRequestedUnits().signum() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested units must be greater than zero");
            }

            BloodRequestItem item = BloodRequestItem.builder()
                    .bloodRequest(request)
                    .bloodGroup(bloodGroup)
                    .requestedUnits(itemDetails.getRequestedUnits())
                    .issuedUnits(BigDecimal.ZERO)
                    .build();
            request.getItems().add(item);
        }

        request.setPriority(details.getPriority() != null && !details.getPriority().isBlank()
                ? details.getPriority() : request.getPriority());
        request.setRequestedBy(details.getRequestedBy());
        request.setRemarks(details.getRemarks());
        if (details.getRequestDate() != null) {
            request.setRequestDate(details.getRequestDate());
        }

        return requestRepository.save(request);
    }

    @Transactional
    public void deleteRequest(UUID id) {
        BloodRequest request = getRequestById(id);

        if ("Approved".equalsIgnoreCase(request.getStatus())) {
            restoreIssuedInventory(request);
        }

        if (request.getItems() != null) {
            for (BloodRequestItem item : request.getItems()) {
                List<BloodIssueLog> logs = issueLogRepository.findByRequestItemId(item.getId());
                if (!logs.isEmpty()) {
                    issueLogRepository.deleteAll(logs);
                }
            }
        }

        request.setApprovedBy(null);
        request.setApprovedDate(null);
        requestRepository.delete(request);
    }

    private void restoreIssuedInventory(BloodRequest request) {
        if (request.getItems() == null) {
            return;
        }
        for (BloodRequestItem item : request.getItems()) {
            List<BloodIssueLog> logs = issueLogRepository.findByRequestItemId(item.getId());
            for (BloodIssueLog log : logs) {
                BloodInventory bag = log.getBloodInventory();
                if (bag == null) {
                    continue;
                }

                BigDecimal restoredUnits = log.getIssuedUnits() != null
                        ? log.getIssuedUnits()
                        : (bag.getUnits() != null ? bag.getUnits() : BigDecimal.ZERO);

                if ("Issued".equalsIgnoreCase(bag.getStatus())) {
                    bag.setStatus("Available");
                    if (log.getIssuedUnits() != null) {
                        bag.setUnits(log.getIssuedUnits());
                    }
                } else {
                    BigDecimal current = bag.getUnits() != null ? bag.getUnits() : BigDecimal.ZERO;
                    bag.setUnits(current.add(restoredUnits));
                    bag.setStatus("Available");
                }
                inventoryRepository.save(bag);
            }
        }
    }

    @Transactional
    public BloodRequest approveRequest(UUID requestId, UUID userId) {
        BloodRequest request = getRequestById(requestId);
        if (!isPending(request)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not in Pending status");
        }

        User approver = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approver user not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request has no blood items to approve");
        }

        for (BloodRequestItem item : request.getItems()) {
            validateItemForApproval(item);
            Integer bloodGroupId = item.getBloodGroup().getId();
            BigDecimal requestedUnits = item.getRequestedUnits();

            List<BloodInventory> availableStock = inventoryRepository
                    .findByBloodGroupIdAndStatusOrderByExpiryDateAsc(bloodGroupId, "Available");

            BigDecimal totalAvailableUnits = availableStock.stream()
                    .map(bag -> bag.getUnits() != null ? bag.getUnits() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalAvailableUnits.compareTo(requestedUnits) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for " + item.getBloodGroup().getGroupName()
                                + ". Required: " + requestedUnits + ", Available: " + totalAvailableUnits);
            }
        }

        for (BloodRequestItem item : request.getItems()) {
            Integer bloodGroupId = item.getBloodGroup().getId();
            BigDecimal remainingToIssue = item.getRequestedUnits();
            List<BloodInventory> availableStock = inventoryRepository
                    .findByBloodGroupIdAndStatusOrderByExpiryDateAsc(bloodGroupId, "Available");

            BigDecimal issuedCount = BigDecimal.ZERO;

            for (BloodInventory bag : availableStock) {
                if (remainingToIssue.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }

                BigDecimal bagUnits = bag.getUnits() != null ? bag.getUnits() : BigDecimal.ZERO;
                if (bagUnits.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                BigDecimal issuedFromBag = bagUnits.min(remainingToIssue);

                if (bagUnits.compareTo(issuedFromBag) == 0) {
                    // Fully consume this bag
                    bag.setStatus("Issued");
                } else {
                    // Partial issue: reduce units on the same bag (no split records)
                    bag.setUnits(bagUnits.subtract(issuedFromBag));
                }
                inventoryRepository.save(bag);

                BloodIssueLog issueLog = BloodIssueLog.builder()
                        .requestItem(item)
                        .bloodInventory(bag)
                        .issuedUnits(issuedFromBag)
                        .issuedBy(approver)
                        .build();
                issueLogRepository.save(issueLog);

                issuedCount = issuedCount.add(issuedFromBag);
                remainingToIssue = remainingToIssue.subtract(issuedFromBag);
            }

            item.setIssuedUnits(issuedCount);
        }

        request.setStatus("Approved");
        request.setApprovedBy(approver);
        request.setApprovedDate(LocalDateTime.now());
        return requestRepository.save(request);
    }

    @Transactional
    public BloodRequest rejectRequest(UUID requestId) {
        BloodRequest request = getRequestById(requestId);
        if (!isPending(request)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not in Pending status");
        }
        request.setStatus("Rejected");
        return requestRepository.save(request);
    }

    public List<BloodRequest> getPendingRequests() {
        return getAllRequests().stream()
                .filter(this::isPending)
                .toList();
    }

    private void validateItemForApproval(BloodRequestItem item) {
        if (item.getBloodGroup() == null || item.getBloodGroup().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request item is missing blood group");
        }
        if (item.getRequestedUnits() == null || item.getRequestedUnits().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request item has invalid units");
        }
    }

    private boolean isPending(BloodRequest request) {
        return request.getStatus() == null
                || request.getStatus().isBlank()
                || "Pending".equalsIgnoreCase(request.getStatus());
    }

    private BloodRequest normalizeRequest(BloodRequest request) {
        boolean changed = false;
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            request.setStatus("Pending");
            changed = true;
        }
        if (request.getRequestDate() == null) {
            request.setRequestDate(LocalDate.now());
            changed = true;
        }
        return changed ? requestRepository.save(request) : request;
    }
}
