package com.bloodsystem.controller;

import com.bloodsystem.model.Appointment;
import com.bloodsystem.model.User;
import com.bloodsystem.repository.UserRepository;
import com.bloodsystem.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    public Appointment getAppointmentById(@PathVariable UUID id) {
        return appointmentService.getAppointmentById(id);
    }

    @PostMapping
    public Appointment createAppointment(@RequestBody Appointment appointment, Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            appointment.setCreatedBy(user);
        }
        return appointmentService.createAppointment(appointment);
    }

    @PutMapping("/{id}")
    public Appointment updateAppointment(@PathVariable UUID id, @RequestBody Appointment details) {
        return appointmentService.updateAppointment(id, details);
    }

    @DeleteMapping("/{id}")
    public void deleteAppointment(@PathVariable UUID id) {
        appointmentService.deleteAppointment(id);
    }

    @GetMapping("/date")
    public List<Appointment> getAppointmentsByDate(@RequestParam String date) {
        LocalDate localDate = LocalDate.parse(date);
        return appointmentService.getAppointmentsForDate(localDate);
    }
}
