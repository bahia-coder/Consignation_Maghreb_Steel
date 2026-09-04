package com.consignation.app.service;

import com.consignation.app.dto.ZoneDTO;
import com.consignation.app.model.Zone;
import com.consignation.app.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ZoneService {

    private final ZoneRepository zoneRepository;

    public List<ZoneDTO> findAll() {
        return zoneRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ZoneDTO findById(Long id) {
        return zoneRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Zone non trouvée : " + id));
    }

    public ZoneDTO toDTO(Zone z) {
        return ZoneDTO.builder()
                .id(z.getId())
                .code(z.getCode())
                .nom(z.getNom())
                .build();
    }
}
