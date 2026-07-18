package com.bloodsystem.service;

import com.bloodsystem.model.Appointment;
import com.bloodsystem.model.Donor;
import com.bloodsystem.repository.AppointmentRepository;
import com.bloodsystem.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DonorRepository donorRepository;

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll().stream()
                .map(this::normalizeAppointment)
                .toList();
    }

    public Appointment getAppointmentById(UUID id) {
        Appointment app = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found with ID: " + id));
        return normalizeAppointment(app);
    }

    public Appointment createAppointment(Appointment appointment) {
        if (appointment.getDonor() == null || appointment.getDonor().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor is required");
        }
        Donor donor = donorRepository.findById(appointment.getDonor().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor not found"));
        appointment.setDonor(donor);

        if (appointment.getAppointmentDate() == null || appointment.getAppointmentTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment date and time are required");
        }
        if (appointment.getStatus() == null || appointment.getStatus().isBlank()) {
            appointment.setStatus("Scheduled");
        }
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointment(UUID id, Appointment details) {
        Appointment app = getAppointmentById(id);
        if (details.getDonor() != null && details.getDonor().getId() != null) {
            Donor donor = donorRepository.findById(details.getDonor().getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor not found"));
            app.setDonor(donor);
        }
        if (details.getAppointmentDate() != null) {
            app.setAppointmentDate(details.getAppointmentDate());
        }
        if (details.getAppointmentTime() != null) {
            app.setAppointmentTime(details.getAppointmentTime());
        }
        if (details.getStatus() != null && !details.getStatus().isBlank()) {
            app.setStatus(details.getStatus());
        }
        app.setRemarks(details.getRemarks());
        return appointmentRepository.save(app);
    }

    public void deleteAppointment(UUID id) {
        Appointment app = getAppointmentById(id);
        appointmentRepository.delete(app);
    }

    public List<Appointment> getAppointmentsForDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDate(date).stream()
                .map(this::normalizeAppointment)
                .toList();
    }

    private Appointment normalizeAppointment(Appointment appointment) {
        if (appointment.getStatus() == null || appointment.getStatus().isBlank()) {
            appointment.setStatus("Scheduled");
            return appointmentRepository.save(appointment);
        }
        return appointment;
    }
}
