# Примеры реализации бэкенда (Spring Boot)

## 📁 Структура проекта

```
src/main/java/com/networking/
├── NetworkingApplication.java
├── config/
│   └── WebConfig.java (CORS настройки)
├── controller/
│   ├── ProfileController.java
│   └── MatchController.java
├── service/
│   ├── ProfileService.java
│   ├── MatchService.java
│   └── FileStorageService.java
├── repository/
│   ├── ProfileRepository.java
│   ├── SwipeRepository.java
│   └── MatchRepository.java
├── model/
│   ├── Profile.java
│   ├── Swipe.java
│   └── Match.java
└── dto/
    ├── ProfileRequest.java
    ├── ProfileResponse.java
    ├── LikeRequest.java
    └── MatchResponse.java
```

## 🗄️ Entity классы

### Profile.java

```java
package com.networking.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "profiles")
@Data
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;
    
    private String username;
    
    @Column(name = "first_name")
    private String firstName;
    
    @Column(name = "last_name")
    private String lastName;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String gender;
    
    @Column(nullable = false)
    private Integer age;
    
    @Column(nullable = false)
    private String city;
    
    @Column(nullable = false)
    private String university;
    
    @Column(columnDefinition = "TEXT")
    private String interests; // JSON строка
    
    @Column(columnDefinition = "TEXT")
    private String goals; // JSON строка
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    @Column(name = "photo_url")
    private String photoUrl;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### Swipe.java

```java
package com.networking.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "swipes")
@Data
public class Swipe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "target_profile_id", nullable = false)
    private Long targetProfileId;
    
    @Column(nullable = false)
    private String action; // "like" или "pass"
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### Match.java

```java
package com.networking.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Data
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user1_id", nullable = false)
    private Long user1Id;
    
    @Column(name = "user2_id", nullable = false)
    private Long user2Id;
    
    @Column(name = "matched_at")
    private LocalDateTime matchedAt;
    
    @PrePersist
    protected void onCreate() {
        matchedAt = LocalDateTime.now();
    }
}
```

## 📦 Repository интерфейсы

### ProfileRepository.java

```java
package com.networking.repository;

import com.networking.model.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);
    
    @Query("SELECT p FROM Profile p WHERE p.userId != :userId " +
           "AND p.userId NOT IN (SELECT s.targetProfileId FROM Swipe s WHERE s.userId = :userId) " +
           "AND p.userId NOT IN (SELECT CASE WHEN m.user1Id = :userId THEN m.user2Id ELSE m.user1Id END FROM Match m WHERE m.user1Id = :userId OR m.user2Id = :userId) " +
           "AND (:city IS NULL OR p.city = :city) " +
           "AND (:university IS NULL OR p.university = :university)")
    Page<Profile> findAvailableProfiles(
        @Param("userId") Long userId,
        @Param("city") String city,
        @Param("university") String university,
        Pageable pageable
    );
}
```

### SwipeRepository.java

```java
package com.networking.repository;

import com.networking.model.Swipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SwipeRepository extends JpaRepository<Swipe, Long> {
    Optional<Swipe> findByUserIdAndTargetProfileId(Long userId, Long targetProfileId);
    
    boolean existsByUserIdAndTargetProfileIdAndAction(Long userId, Long targetProfileId, String action);
}
```

### MatchRepository.java

```java
package com.networking.repository;

import com.networking.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    @Query("SELECT m FROM Match m WHERE m.user1Id = :userId OR m.user2Id = :userId")
    List<Match> findByUserId(@Param("userId") Long userId);
    
    boolean existsByUser1IdAndUser2Id(Long user1Id, Long user2Id);
    boolean existsByUser1IdAndUser2IdOrUser2IdAndUser1Id(Long user1Id, Long user2Id, Long user2Id2, Long user1Id2);
}
```

## 🎯 Service классы

### ProfileService.java (упрощенная версия)

```java
package com.networking.service;

import com.networking.model.Profile;
import com.networking.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@Service
public class ProfileService {
    
    @Autowired
    private ProfileRepository profileRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    public Profile createOrUpdateProfile(Profile profile, MultipartFile photo) {
        // Сохранение фото
        if (photo != null && !photo.isEmpty()) {
            String photoUrl = fileStorageService.storeFile(photo);
            profile.setPhotoUrl(photoUrl);
        }
        
        // Проверка существующего профиля
        Optional<Profile> existing = profileRepository.findByUserId(profile.getUserId());
        if (existing.isPresent()) {
            Profile existingProfile = existing.get();
            // Обновление полей
            existingProfile.setName(profile.getName());
            existingProfile.setGender(profile.getGender());
            // ... обновить остальные поля
            return profileRepository.save(existingProfile);
        }
        
        return profileRepository.save(profile);
    }
    
    public Page<Profile> getAvailableProfiles(Long userId, String city, String university, Pageable pageable) {
        return profileRepository.findAvailableProfiles(userId, city, university, pageable);
    }
    
    public Optional<Profile> getProfileById(Long id) {
        return profileRepository.findById(id);
    }
}
```

### MatchService.java

```java
package com.networking.service;

import com.networking.model.Match;
import com.networking.model.Swipe;
import com.networking.repository.MatchRepository;
import com.networking.repository.SwipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MatchService {
    
    @Autowired
    private SwipeRepository swipeRepository;
    
    @Autowired
    private MatchRepository matchRepository;
    
    @Transactional
    public boolean likeProfile(Long userId, Long targetProfileId) {
        // Сохраняем лайк
        Swipe swipe = new Swipe();
        swipe.setUserId(userId);
        swipe.setTargetProfileId(targetProfileId);
        swipe.setAction("like");
        swipeRepository.save(swipe);
        
        // Проверяем взаимный лайк
        boolean isMutualLike = swipeRepository.existsByUserIdAndTargetProfileIdAndAction(
            targetProfileId, userId, "like"
        );
        
        if (isMutualLike) {
            // Создаем мэтч
            Match match = new Match();
            match.setUser1Id(Math.min(userId, targetProfileId));
            match.setUser2Id(Math.max(userId, targetProfileId));
            matchRepository.save(match);
            return true;
        }
        
        return false;
    }
    
    @Transactional
    public void passProfile(Long userId, Long targetProfileId) {
        Swipe swipe = new Swipe();
        swipe.setUserId(userId);
        swipe.setTargetProfileId(targetProfileId);
        swipe.setAction("pass");
        swipeRepository.save(swipe);
    }
    
    public List<Match> getMatches(Long userId) {
        return matchRepository.findByUserId(userId);
    }
}
```

## 🌐 Controller классы

### ProfileController.java

```java
package com.networking.controller;

import com.networking.model.Profile;
import com.networking.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@RestController
@RequestMapping("/api/profiles")
@CrossOrigin(origins = "*")
public class ProfileController {
    
    @Autowired
    private ProfileService profileService;
    
    @PostMapping
    public ResponseEntity<Profile> createProfile(
            @RequestParam("userId") Long userId,
            @RequestParam("name") String name,
            @RequestParam("gender") String gender,
            @RequestParam("age") Integer age,
            @RequestParam("city") String city,
            @RequestParam("university") String university,
            @RequestParam("interests") String interests,
            @RequestParam("goals") String goals,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        
        Profile profile = new Profile();
        profile.setUserId(userId);
        profile.setName(name);
        profile.setGender(gender);
        profile.setAge(age);
        profile.setCity(city);
        profile.setUniversity(university);
        profile.setInterests(interests);
        profile.setGoals(goals);
        profile.setBio(bio);
        
        Profile saved = profileService.createOrUpdateProfile(profile, photo);
        return ResponseEntity.ok(saved);
    }
    
    @GetMapping
    public ResponseEntity<Page<Profile>> getProfiles(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "university", required = false) String university,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Profile> profiles = profileService.getAvailableProfiles(userId, city, university, pageable);
        return ResponseEntity.ok(profiles);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Profile> getProfile(@PathVariable Long id) {
        Optional<Profile> profile = profileService.getProfileById(id);
        return profile.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
}
```

### MatchController.java

```java
package com.networking.controller;

import com.networking.model.Match;
import com.networking.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MatchController {
    
    @Autowired
    private MatchService matchService;
    
    @PostMapping("/profiles/{profileId}/like")
    public ResponseEntity<Map<String, Object>> likeProfile(
            @PathVariable Long profileId,
            @RequestBody Map<String, Long> request) {
        
        Long userId = request.get("userId");
        boolean matched = matchService.likeProfile(userId, profileId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("matched", matched);
        response.put("message", matched ? "Вы замэтчились!" : "Лайк отправлен");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/profiles/{profileId}/pass")
    public ResponseEntity<Map<String, Object>> passProfile(
            @PathVariable Long profileId,
            @RequestBody Map<String, Long> request) {
        
        Long userId = request.get("userId");
        matchService.passProfile(userId, profileId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Профиль пропущен");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/matches")
    public ResponseEntity<List<Match>> getMatches(@RequestParam("userId") Long userId) {
        List<Match> matches = matchService.getMatches(userId);
        return ResponseEntity.ok(matches);
    }
}
```

## ⚙️ Конфигурация

### WebConfig.java (CORS)

```java
package com.networking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("*") // В production укажите конкретные домены
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

## 📝 Примечания

Это упрощенные примеры. В production добавьте:
- Валидацию данных
- Обработку ошибок
- Логирование
- Безопасность (JWT, rate limiting)
- Тестирование

