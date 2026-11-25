package com.kikitraiteur.b2b;

import com.kikitraiteur.b2b.auth.bootstrap.SuperAdminBootstrap;
import com.kikitraiteur.b2b.auth.entity.RoleName;
import com.kikitraiteur.b2b.auth.entity.UserEntity;
import com.kikitraiteur.b2b.auth.repository.UserRepository;
import com.kikitraiteur.b2b.paiement.entity.PaiementWaveEntity;
import com.kikitraiteur.b2b.paiement.repository.PaiementWaveRepository;
import com.kikitraiteur.b2b.paiement.service.WavePaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class WaveAndBootstrapTest {

    @Test
    void waveCheckoutZeroResteIsImmediatelyPaid() {
        PaiementWaveRepository repo = mock(PaiementWaveRepository.class);
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        WavePaymentService svc = new WavePaymentService(repo);
        ReflectionTestUtils.setField(svc, "waveMode", "SIMULATION");
        ReflectionTestUtils.setField(svc, "frontendUrl", "https://btob-kiki.vercel.app");

        PaiementWaveEntity p = svc.initierCheckout("CMD-1", "ent-001", "TOT-1", "Babacar", 5000, 5000, 0);
        assertEquals("PAYEE", p.getStatut());
        assertEquals(0, p.getPartEmploye());
    }

    @Test
    void waveCheckoutSimulationCanBeConfirmed() {
        PaiementWaveRepository repo = mock(PaiementWaveRepository.class);
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        WavePaymentService svc = new WavePaymentService(repo);
        ReflectionTestUtils.setField(svc, "waveMode", "SIMULATION");
        ReflectionTestUtils.setField(svc, "frontendUrl", "https://btob-kiki.vercel.app");

        PaiementWaveEntity pending = svc.initierCheckout("CMD-2", "ent-001", "TOT-2", "Awa", 5000, 2500, 2500);
        assertEquals("EN_ATTENTE_PAIEMENT", pending.getStatut());
        assertEquals("SIMULATION", pending.getMode());

        when(repo.findById(pending.getId())).thenReturn(Optional.of(pending));
        PaiementWaveEntity paid = svc.confirmerSimulation(pending.getId());
        assertEquals("PAYEE", paid.getStatut());
    }

    @Test
    void superAdminBootstrapSkipsIfAlreadyExists() {
        UserRepository userRepo = mock(UserRepository.class);
        when(userRepo.findByEmailIgnoreCase("admin@kikitraiteur.sn"))
                .thenReturn(Optional.of(UserEntity.builder().email("admin@kikitraiteur.sn").role(RoleName.SUPER_ADMIN).build()));

        SuperAdminBootstrap bootstrap = new SuperAdminBootstrap(userRepo, new BCryptPasswordEncoder());
        ReflectionTestUtils.setField(bootstrap, "superAdminEmail", "admin@kikitraiteur.sn");
        ReflectionTestUtils.setField(bootstrap, "superAdminPassword", "Secret123!");
        bootstrap.run(null);

        verify(userRepo, never()).save(any());
    }
}
